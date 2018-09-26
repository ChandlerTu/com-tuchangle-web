package com.tuchangle.web;

import java.util.Date;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DatabaseLoader implements CommandLineRunner {

  @Autowired
  private DietaryRepository repository;

  @Override
  public void run(String... strings) throws Exception {
    Dietary dietary = new Dietary();
    dietary.setFood("苹果");
    dietary.setGram(100);
    dietary.setInsertTime(new Date());
    this.repository.save(dietary);
  }

}
